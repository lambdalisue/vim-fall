if exists('g:loaded_fall_mapping')
  finish
endif
let g:loaded_fall_mapping = 1

" List
cnoremap <silent> <Plug>(fall-first) <Cmd>call fall#internal#dispatch(#{type: 'move-cursor-at', cursor: 0})<CR>
cnoremap <silent> <Plug>(fall-last) <Cmd>call fall#internal#dispatch(#{type: 'move-cursor-at', cursor: '$'})<CR>
cnoremap <silent> <Plug>(fall-prev) <Cmd>call fall#internal#dispatch(#{type: 'move-cursor', amount: -1})<CR>
cnoremap <silent> <Plug>(fall-next) <Cmd>call fall#internal#dispatch(#{type: 'move-cursor', amount: 1})<CR>
cnoremap <silent> <Plug>(fall-prev:scroll) <Cmd>call fall#internal#dispatch(#{type: 'move-cursor', amount: -1, scroll: v:true})<CR>
cnoremap <silent> <Plug>(fall-next:scroll) <Cmd>call fall#internal#dispatch(#{type: 'move-cursor', amount: 1, scroll: v:true})<CR>
cnoremap <silent> <Plug>(fall-left) <Cmd>call fall#internal#dispatch(#{type: 'list-component-execute', command: 'silent! normal! zh'})<CR>
cnoremap <silent> <Plug>(fall-right) <Cmd>call fall#internal#dispatch(#{type: 'list-component-execute', command: 'silent! normal! zl'})<CR>
cnoremap <silent> <Plug>(fall-left:scroll) <Cmd>call fall#internal#dispatch(#{type: 'list-component-execute', command: 'silent! normal! zH'})<CR>
cnoremap <silent> <Plug>(fall-right:scroll) <Cmd>call fall#internal#dispatch(#{type: 'list-component-execute', command: 'silent! normal! zL'})<CR>

" Select
cnoremap <silent> <Plug>(fall-select) <Cmd>call fall#internal#dispatch(#{type: 'select-item'})<CR>
cnoremap <silent> <Plug>(fall-select-all) <Cmd>call fall#internal#dispatch(#{type: 'select-all-items'})<CR>

" Switch
cnoremap <silent> <Plug>(fall-switch-matcher-first) <Cmd>call fall#internal#dispatch(#{type: 'switch-matcher-at', index: 0})<CR>
cnoremap <silent> <Plug>(fall-switch-matcher-last) <Cmd>call fall#internal#dispatch(#{type: 'switch-matcher-at', index: '$'})<CR>
cnoremap <silent> <Plug>(fall-switch-matcher-prev) <Cmd>call fall#internal#dispatch(#{type: 'switch-matcher', amount: -1, cycle: v:true})<CR>
cnoremap <silent> <Plug>(fall-switch-matcher-next) <Cmd>call fall#internal#dispatch(#{type: 'switch-matcher', amount: 1, cycle: v:true})<CR>
cnoremap <silent> <Plug>(fall-switch-sorter-first) <Cmd>call fall#internal#dispatch(#{type: 'switch-sorter-at', index: 0})<CR>
cnoremap <silent> <Plug>(fall-switch-sorter-last) <Cmd>call fall#internal#dispatch(#{type: 'switch-sorter-at', index: '$'})<CR>
cnoremap <silent> <Plug>(fall-switch-sorter-prev) <Cmd>call fall#internal#dispatch(#{type: 'switch-sorter', amount: -1, cycle: v:true})<CR>
cnoremap <silent> <Plug>(fall-switch-sorter-next) <Cmd>call fall#internal#dispatch(#{type: 'switch-sorter', amount: 1, cycle: v:true})<CR>
cnoremap <silent> <Plug>(fall-switch-renderer-first) <Cmd>call fall#internal#dispatch(#{type: 'switch-renderer-at', index: 0})<CR>
cnoremap <silent> <Plug>(fall-switch-renderer-last) <Cmd>call fall#internal#dispatch(#{type: 'switch-renderer-at', index: '$'})<CR>
cnoremap <silent> <Plug>(fall-switch-renderer-prev) <Cmd>call fall#internal#dispatch(#{type: 'switch-renderer', amount: -1, cycle: v:true})<CR>
cnoremap <silent> <Plug>(fall-switch-renderer-next) <Cmd>call fall#internal#dispatch(#{type: 'switch-renderer', amount: 1, cycle: v:true})<CR>

" Preview
cnoremap <silent> <Plug>(fall-preview-first) <Cmd>call fall#internal#dispatch(#{type: 'preview-component-execute', command: 'silent! normal! gg'})<CR>
cnoremap <silent> <Plug>(fall-preview-last) <Cmd>call fall#internal#dispatch(#{type: 'preview-component-execute', command: 'silent! normal! G'})<CR>
cnoremap <silent> <Plug>(fall-preview-prev) <Cmd>call fall#internal#dispatch(#{type: 'preview-component-execute', command: 'silent! normal! k'})<CR>
cnoremap <silent> <Plug>(fall-preview-next) <Cmd>call fall#internal#dispatch(#{type: 'preview-component-execute', command: 'silent! normal! j'})<CR>
cnoremap <silent> <Plug>(fall-preview-prev:scroll) <Cmd>call fall#internal#dispatch(#{type: 'preview-component-execute', command: 'silent! normal! <C-u>'})<CR>
cnoremap <silent> <Plug>(fall-preview-next:scroll) <Cmd>call fall#internal#dispatch(#{type: 'preview-component-execute', command: 'silent! normal! <C-d>'})<CR>
cnoremap <silent> <Plug>(fall-preview-left) <Cmd>call fall#internal#dispatch(#{type: 'preview-component-execute', command: 'silent! normal! zh'})<CR>
cnoremap <silent> <Plug>(fall-preview-right) <Cmd>call fall#internal#dispatch(#{type: 'preview-component-execute', command: 'silent! normal! zl'})<CR>
cnoremap <silent> <Plug>(fall-preview-left:scroll) <Cmd>call fall#internal#dispatch(#{type: 'preview-component-execute', command: 'silent! normal! zH'})<CR>
cnoremap <silent> <Plug>(fall-preview-right:scroll) <Cmd>call fall#internal#dispatch(#{type: 'preview-component-execute', command: 'silent! normal! zL'})<CR>

" Action
cnoremap <silent> <Plug>(fall-action-select) <Cmd>call fall#action('@select')<CR>

if !get(g:, 'fall_disable_default_mapping')
  function! s:map_picker() abort
    " List
    cnoremap <nowait> <C-t> <Plug>(fall-first)
    cnoremap <nowait> <C-g> <Plug>(fall-last)
    cnoremap <nowait> <C-p> <Plug>(fall-prev)
    cnoremap <nowait> <C-n> <Plug>(fall-next)
    cnoremap <nowait> <C-u> <Plug>(fall-prev:scroll)
    cnoremap <nowait> <C-d> <Plug>(fall-next:scroll)
    cnoremap <nowait> <PageUp> <Plug>(fall-left)
    cnoremap <nowait> <PageDown> <Plug>(fall-right)
    cnoremap <nowait> <S-PageUp> <Plug>(fall-left:scroll)
    cnoremap <nowait> <S-PageDown> <Plug>(fall-right:scroll)
    cnoremap <nowait> <C-,> <Plug>(fall-select)
    cnoremap <nowait> <C-.> <Plug>(fall-select-all)
    cnoremap <nowait> <C-j> <Plug>(fall-select)<Plug>(fall-next)
    cnoremap <nowait> <C-k> <Plug>(fall-prev)<Plug>(fall-select)
    " Preview
    cnoremap <nowait> <Home> <Plug>(fall-preview-first)
    cnoremap <nowait> <End> <Plug>(fall-preview-last)
    cnoremap <nowait> <Up> <Plug>(fall-preview-prev)
    cnoremap <nowait> <Down> <Plug>(fall-preview-next)
    cnoremap <nowait> <S-Up> <Plug>(fall-preview-prev:scroll)
    cnoremap <nowait> <S-Down> <Plug>(fall-preview-next:scroll)
    cnoremap <nowait> <Left> <Plug>(fall-preview-left)
    cnoremap <nowait> <Right> <Plug>(fall-preview-right)
    cnoremap <nowait> <S-Left> <Plug>(fall-preview-left:scroll)
    cnoremap <nowait> <S-Right> <Plug>(fall-preview-right:scroll)
    " Action
    cnoremap <nowait> <Tab> <Plug>(fall-action-select)
    " Switch
    cnoremap <nowait> <F2> <Plug>(fall-switch-matcher-next)
    cnoremap <nowait> <F3> <Plug>(fall-switch-sorter-next)
    cnoremap <nowait> <F4> <Plug>(fall-switch-renderer-next)
  endfunction

  augroup fall_mapping_plugin
    autocmd!
    autocmd User FallPickerEnter:* call s:map_picker()
  augroup END
endif
